import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SignupFieldsProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  yearOfBirth: string;
  setYearOfBirth: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  incomeRange: string;
  setIncomeRange: (value: string) => void;
  householdMembers: string;
  setHouseholdMembers: (value: string) => void;
  zipCode: string;
  setZipCode: (value: string) => void;
}

export const SignupFields: React.FC<SignupFieldsProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  yearOfBirth,
  setYearOfBirth,
  phoneNumber,
  setPhoneNumber,
  incomeRange,
  setIncomeRange,
  householdMembers,
  setHouseholdMembers,
  zipCode,
  setZipCode
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Legal First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g., Ginho"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Legal Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g., Tam"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="yearOfBirth">Year of Birth</Label>
          <Input
            id="yearOfBirth"
            type="number"
            value={yearOfBirth}
            onChange={(e) => setYearOfBirth(e.target.value)}
            placeholder="e.g., 1999"
            min="1900"
            max={new Date().getFullYear()}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="householdMembers">Members in Household</Label>
          <Input
            id="householdMembers"
            type="number"
            value={householdMembers}
            onChange={(e) => setHouseholdMembers(e.target.value)}
            placeholder="1-10"
            min="1"
            max="10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g., 123-456-7890"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="incomeRange">Income Range</Label>
        <Select value={incomeRange} onValueChange={setIncomeRange} required>
          <SelectTrigger>
            <SelectValue placeholder="Select income range..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under-25k">Under $25,000</SelectItem>
            <SelectItem value="25k-49k">$25,000 - $49,999</SelectItem>
            <SelectItem value="50k-74k">$50,000 - $74,999</SelectItem>
            <SelectItem value="75k-99k">$75,000 - $99,999</SelectItem>
            <SelectItem value="100k-plus">$100,000 and above</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip Code</Label>
        <Input
          id="zipCode"
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="e.g., 12345"
          required
        />
      </div>
    </>
  );
};